package com.marketingtool.workspace;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class WorkspaceMemberRepositoryTest {

    @Autowired private WorkspaceMemberRepository memberRepository;
    @Autowired private WorkspaceRepository workspaceRepository;
    @Autowired private UserRepository userRepository;

    @Test
    void createOwnerMember_fetchByWorkspaceId_correct() {
        User user = new User();
        user.setEmail("member-test@example.com");
        user.setPasswordHash("hash");
        user = userRepository.save(user);

        Workspace ws = new Workspace();
        ws.setName("Member Test WS");
        ws = workspaceRepository.save(ws);

        WorkspaceMember member = new WorkspaceMember();
        member.setId(new WorkspaceMemberId(ws.getId(), user.getId()));
        member.setWorkspace(ws);
        member.setUser(user);
        member.setRole(WorkspaceMember.Role.OWNER);
        memberRepository.save(member);

        List<WorkspaceMember> members = memberRepository.findByIdWorkspaceId(ws.getId());
        assertThat(members).hasSize(1);
        assertThat(members.get(0).getRole()).isEqualTo(WorkspaceMember.Role.OWNER);
    }
}
